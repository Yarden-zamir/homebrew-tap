# typed: false
# frozen_string_literal: true

class ZshActCompletion < Formula
  desc "Zsh completions for act (for github)"
  homepage "https://github.com/Yarden-zamir/zsh-act-completion"
  url "https://github.com/Yarden-zamir/zsh-act-completion/archive/refs/tags/v0.0.34.tar.gz"
  sha256 "54f75ed817eae0df0dee00d3a6fca98fc89e9b40da623729c9844174001615f0"
  license "MIT"

  def install
    zsh_completion.install "zsh/_act" => "_act"
  end
end
