# typed: false
# frozen_string_literal: true

# This file was generated by Homebrew Releaser. DO NOT EDIT.
class Wrap < Formula
  desc "Generates 'wraps' for functions in any language using 'processors'"
  homepage "https://github.com/Yarden-zamir/WRAP"
  url "https://github.com/Yarden-zamir/WRAP/archive/v0.2.55.tar.gz"
  sha256 "5eed121475947d5c7ac4b1112b7f94c3772798fd8885bdede1762d53320e9812"
  license "MIT"

  depends_on "python@3.11"

  def install
    libexec.install Dir["*"]
bin.write_exec_script libexec/"wrap"
(libexec/"VERSION").write version
  end
end
