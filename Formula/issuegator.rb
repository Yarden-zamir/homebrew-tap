# typed: false
# frozen_string_literal: true

class Issuegator < Formula
  desc "Rust TUI GitHub issue explorer for the current repository"
  homepage "https://github.com/Yarden-zamir/issuegator"
  url "https://github.com/Yarden-zamir/issuegator/archive/refs/tags/v0.1.0.tar.gz"
  sha256 "092dad98163e36e73c8087c11d82b10e6325a14861d9a5bc9823b024aa865335"
  license "MIT"
  head "https://github.com/Yarden-zamir/issuegator.git", branch: "main"

  depends_on "rust" => :build
  depends_on "gh"

  def install
    system "cargo", "install", *std_cargo_args
  end

  test do
    assert_predicate bin/"issuegator", :exist?
  end
end
